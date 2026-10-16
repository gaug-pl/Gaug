# Asynchronous Function Calls
::: warning WARNING
Async calls are disabled in safe mode! Attempt to call a function asynchronously will lead to errors!
:::
To call a function asynchronously, you need to add `async` before the function.

```gaug
func getRequest() -> (
    const Response = http.get("https://example.com");

    if (Response) -> (
        print("Success!");
        return Response;
    );
)

const Request = async getRequest();
print(Request);
```

## What does calling functions asynchronously do?
> It allows a program to start long-running tasks like HTTP requests and executes other code while waiting for the task to finish.