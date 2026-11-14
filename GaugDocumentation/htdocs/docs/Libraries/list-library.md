# List Library

::: fn list.new
> Creates a new list.

returns list

```gaug
var List = list.new();

print("Created a new list! " + List); # Output: Created a new list! []

```
:::

::: fn list.push
> Pushes a value to an already existing list.
param list: list - The list to push the value to.
param value: super - The value to push to the list.

```gaug
var List = list.new();
list.push(List, "Hello World");

print(List); # [Hello World]

```
:::

::: fn list.get
param list: list - The list that has the passed index registered.
param index: int - The index to get the value from.

returns super

> Gets a value from a list using it's index.
```gaug
var List = list.new();
list.push(List, "Hello World");

print(list.get(List, 0)); # Hello World

```
:::

::: fn list.copy
param list: list - The list that has the passed index registered.
param index: int - The index to get the value from.

returns list

::: warning WARNING
Attempting to check if a list is equal using == will always result to false, even if it contains the same values.
:::
> Returns a shallow copy of the passed list.

```gaug
var SomeList = {"value1", "value2", "value3"};
var NewList = list.copy(SomeList);
var Equal >>> boolean = false;

if (NewList == SomeList) -> (
    Equal = true
);

print(SomeList);
print(NewList);

# Output: [value1, value2, value3] [value1, value2, value3]
```

::: fn list.remove
param list: list - The list that has the passed index registered.
param index: int - The index to get the value from.

returns list

> Removes the value from a list using the passed index.

```gaug
var SomeList = {"value1", "value2", "value3"};

print(SomeList); # Output: [value1, value2, value3]

list.remove(SomeList, 0);

print(SomeList); # Output: [value2, value3]

```