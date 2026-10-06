# Builtins

## `print(...)`
> Prints a value.

```gaug
print("Hello World!");
```

`Output: Hello World!`

## `len(string)`
> Returns the amount of characters in a string.

```gaug
var String = "Hello World";

print(len(String));
```

`Output: 11`

## `wait(time: float)`
> Pauses the current `task` for the amount of time passed. 

```gaug
wait(5);
print("Waited 5 seconds!");
```

`Output: Waited 5 seconds!`

## `type(val: super)`
::: warning WARNING
The type builtin does not support custom types, If you would like to check for a custom type then it is recommended to use supertype() as it covers super and user-defined types.
:::
> Returns the type of the passed value

```gaug
var String = "Hello";
var Boolean = true;
var Float = 5.2;

print(
    type(String), type(Boolean), type(Float)
);
```

`Output: string boolean float`