# List Library

::: warning
This feature is still in progress and is not complete.
:::

## `list.new()`
::: warning Notice
Do not use {} to create lists until further notice.
:::
> Creates a new list
```gaug
var List = list.new();

print("Created a new list! " + List);

```

`Output: Created a new list! []`

## `list.push(list, value)`
> Adds a new value to a list
```gaug
var List = list.new();
list.push(List, "Hello World");

print(List)

```

`Output: [Hello World]`

## `list.get(list, index)`
> Gets the values in a list
```gaug
var List = list.new();
list.push(List, "Hello World");

print(list.get(List, 0));

```

`Output: Hello World`