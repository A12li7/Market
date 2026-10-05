import { fromEnv } "mo:caffeineai-inference-client/Config";
import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";
import Runtime "mo:core/Runtime";

module {
  /// Send one chat completion to Caffeine Inference and return the assistant
  /// text. Credentials come from the platform via `fromEnv<system>()` on every
  /// request; nothing is cached or stored.
  public func runChat<system>(prompt : Text) : async* Text {
    let config = fromEnv<system>();
    let userMessage = ChatCompletionRequestMessageOneOf2.JSON.init({
      content = #string(prompt);
      role = #user;
    });
    let request = ChatCompletionRequest.JSON.init({
      messages = [#user(userMessage)];
      model = "router";
    });
    let response = await* ChatApi.createChatCompletion(config, request);
    if (response.choices.size() == 0) {
      Runtime.trap("Inference returned no choices");
    };
    response.choices[0].message.content
      ?? Runtime.trap("Inference returned no text content");
  };
};
