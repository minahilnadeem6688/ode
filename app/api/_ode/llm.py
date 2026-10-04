"""
The model behind the words. The pipeline only needs one thing from it: given instructions, a
message and a schema, return an object of that schema. Any provider that can do that plugs in
here; OpenAI is the first.

Environment:
  OPENAI_API_KEY   turns the model on (without it every drink is made by the rules engine)
  ODE_MODEL        defaults to gpt-4o-mini
  OPENAI_BASE_URL  optional, for any OpenAI-compatible endpoint
"""
import os


class ModelError(Exception):
    pass


class OpenAIModel:
    def __init__(self, key, model):
        from openai import OpenAI

        self.name = model
        self.client = OpenAI(api_key=key, timeout=12, max_retries=1)

    def structured(self, instructions, message, schema, max_tokens=500):
        try:
            res = self.client.responses.parse(
                model=self.name,
                instructions=instructions,
                input=message,
                text_format=schema,
                max_output_tokens=max_tokens,
                store=False,
            )
        except Exception as e:  # network, quota, timeout: the caller falls back to rules
            raise ModelError(type(e).__name__) from e
        if res.output_parsed is None:
            raise ModelError("no parsed output")
        return res.output_parsed

    def flagged(self, text):
        """True when the customer's words should not be echoed back in a poem."""
        if not text.strip():
            return False
        try:
            r = self.client.moderations.create(model="omni-moderation-latest", input=text)
            return bool(r.results[0].flagged)
        except Exception:
            return False


_model = None


def model():
    global _model
    if _model is None and os.environ.get("OPENAI_API_KEY"):
        _model = OpenAIModel(os.environ["OPENAI_API_KEY"], os.environ.get("ODE_MODEL", "gpt-4o-mini"))
    return _model


def set_model(m):
    """Tests swap in a scripted model here."""
    global _model
    _model = m
