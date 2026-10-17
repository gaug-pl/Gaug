# HTTP Library

::: fn http.post
param url: string - The URL to send the POST request to.
param body: string - The HTTP response body.
param headers?: dict - Headers metadata to send to the server.

> Sends a POST request to the passed URL.

```gaug
var Body = json.encode({});

func sendRequest() -> (
    var Response = http.post(
        "https://example.com",
        Body
    );

    print(Response);
);

sendRequest();
```
:::

::: fn http.get
param url: string - The URL to send the GET request to.
param headers?: dict - Headers metadata to send to the server.

> Sends a GET request to the passed URL.

```gaug

func sendRequest() -> (
    var Response = http.get("https://example.com");

    print(Response);
);

sendRequest();
```
:::

::: fn http.request
param url: string - The URL to send the GET request to.
param headers?: dict - Headers metadata to send to the server.

> Sends a GET request to the passed URL.

```gaug

func sendRequest() -> (
    var Response = http.get("https://example.com");

    print(Response);
);

sendRequest();
```
:::

::: fn http.generateUUID
returns string
> Generates a new UUID (not to be confused with GUID).

```gaug
var UUID = json.generateUUID();

print(UUID); # will always print a new UUID.
```
:::

::: fn http.query
param url: string - The URL to send the QUERY request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a QUERY request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.put
param url: string - The URL to send the PUT request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a QUERY request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.patch
param url: string - The URL to send the PATCH request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a PATCH request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.delete
param url: string - The URL to send the DELETE request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a DELETE request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.head
param url: string - The URL to send the HEAD request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a HEAD request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.options
param url: string - The URL to send the OPTIONS request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a OPTIONS request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.trace
param url: string - The URL to send the TRACE request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a TRACE request to the passed URL.

```gaug
# to be added.
```
:::

::: fn http.connect
param url: string - The URL to send the CONNECT request to.

::: warning WARNING
This feature is still not added (planed for the future).

This feature is planned to be released in Gaug v1.0.5
:::

> Sends a CONNECT request to the passed URL.

```gaug
# to be added.
```
:::