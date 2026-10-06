# Asynchronous Function Calls
To call a function asynchronously, you need to add `async.call` or `async` before the function.

```gaug
getRequest() -> (
    const Response = http.get("https://example.com");

    if (Response) -> (
        print("Success!");
        return Response;
    );
)

const Request = async.call getRequest(); # async getRequest(); also works here.
print(Request);
```

## What does calling functions asynchronously do?
> It allows a program to start long-running tasks like HTTP requests and executing other code while waiting for the task to finish.
