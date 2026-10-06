# Types

Types can be used to blah blah blah, and they include:
## `string`
A string is a line of text inside double or single quotes.
::: details Example
```gaug
var Text = "This is a string!";

print(Text)
```

`Output: This is a string!`
:::

## `int`
An integer is a number without any fractional or decimal parts.
::: details Example
```gaug
var Integer = 5;

print(Integer)
```

`Output: 5`
:::

## `number`
A number can be an integer or float.
::: details Example
```gaug
var Number = 3.2;

print(Number)
```

`Output: 3.2`
:::

## `dict`
A dictionary is a type used to store information in key-value pairs.
You need to use <> to reference an object inside a dict.

::: details Example
```gaug
var Info = {
    ("Name") = "Joe";
    ("Age") = 22;
    ("RelationshipStatus") = "Single"
};

print(Info);

Info<"RelationshipStatus"> = "Married";

print(Info);

```

`Output: `
:::

## `list`
A list is a type used to store a collection of items under a single variable/constant by using Zero-based indexing.

::: details Example
```gaug
var Members = {
    "Member1",
    "Member2",
    "Member3",
    "Member4",
};

print(Members);
```

`Output: [Member1, Member2, Member3, Member4]`
:::

## `task`
A task is an OS thread, typically returned on a function that is called asynchronously using `async.call function()`.

::: details Example
```gaug
var Variable >>> string = "";

a() -> (
    return "string"
) >>> string;

f() -> (
    Variable = async.call a();
) >>> boolean;

f();

print(type(Variable));
```

`Output: task`
:::

## `null`
Null is the lack of value.

## `boolean`
A boolean is either true or false.

::: details Example
```gaug
```

`Output:`
:::

## `function`
A boolean is either true or false.

## `super`
A super is a value that accepts any custom/builtin type.

::: details Example
```gaug
type new Inventory = {
    string
}
```

`Output:`
:::

## Custom Types

To create a new type however, you can use `type new` or `type modify` if you would like to modify an already existing custom type.

```gaug
type new Player = {
    Name >>> string;
    ID >>> number;
};

var Player >>> Player = {};
Player<"Name"> = "Player1";
Player<"ID"> = 1;

type modify Player = {
    ... # use ellipsis to not disregard what we set up above.
    Inventory >>> dict
}

Player<"Inventory"> = {
    "Item1",
    "Item2",
};
```