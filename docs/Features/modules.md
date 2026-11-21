# Modules

::: warning
This feature is still in progress and is not complete.
:::

## What is a Module?
A module is a .gaug file that can be imported using `get "./fileLocation" as Name`, The module must explicitly export a value or else it will default to `null`.

::: details Example
```gaug
# module.gaug
class module -> (
    global const Version = "v1.0.1";

    global func add(...: number) -> (
        var Total >>> number = 0;

        for number in ... -> (
            Total = Total + number;
        );
    );
);

export module;

# file.gaug
get "./module" as Module;

print(Module.add(5, 2, 3) + ", Current Version:", Module.Version);

```
:::