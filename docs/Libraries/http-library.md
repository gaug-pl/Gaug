# HTTP Library

::: warning
This documentation is currently in progress.
:::

::: fn http.post
param url: string - The URL to send the POST request to.
param body: string - The HTTP response body.
param headers: $(dict: optional) - Headers metadata to send to the server.

> Sends a POST request to the passed URL.

```gaug
var Body = json.encode({});

func sendRequest() -> (
    var Response = http.post(
        "https://example.com",
        Body
    );

    return Response;
);

print(sendRequest());
```
:::