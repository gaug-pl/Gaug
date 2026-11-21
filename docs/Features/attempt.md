# Safe Calls (Attempt)
Safe Calls can be used to handle errors without crashing or stopping your program. It allows you to run code that might fail or decide what should happen if an error occurs.

## Syntax
Attempt accepts functions, so you can call it either by making a new function (`() -> ()`) or using a premade one.

```gaug
attempt () -> (
    # code here.
);
```

```gaug
func f() -> (
    # code here
);

attempt f();
```

To handle errors or exceptions, you need to add `except` next to the last closing bracket.
```gaug
attempt () -> (
    # code here.
) except(e: string) -> (  # e is the error
    # code here
);
```

To only check if one error happens, provide the error `enum` next to except.
```gaug
attempt () -> (
    # code here.
) except enum.errors.RUNTIME_ERROR () -> (
    # code here
);
```

When attempt successfully finishes running. It will run `success` (if passed.)
```gaug
attempt () -> (
    print("Hello World!");
) success() -> (
    print("Success!");
);

# Both will be printed.
```