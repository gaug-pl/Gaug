# Modules

::: warning
This feature is still in progress and is not complete.
:::

## What is a Module?
A module is a .gaug file that can be imported using `get "./fileLocation" as Name`, The module must explicitly return a value or else it will default to `null`.

::: details Example
```gaug
# module.gaug
var module = {};
module<"Version"> = "v1.0.1";
module<"Add">(...: number) -> (
    var Total = 0;

    for number in ... (
        Total = Total + number;
    );
);

return module;

# file.gaug
get "./module" as Module;

print(Module.Add(5, 2, 3) + ", Current Version:", Module<"Version">);

```
:::