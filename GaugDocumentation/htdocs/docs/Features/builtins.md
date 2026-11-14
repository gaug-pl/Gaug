# Builtins

::: fn print
param ...val: super - The value to print.

> Prints the passed parameters to the console.

```gaug
print("Hello World!");
```
:::

::: fn ask
param ...val: string - The message to print.
return string

> Prints the passed parameters then pauses the current thread until input is received.

```gaug
var Name = ask("What's your name? ");

print("Hello!", Name);
```
:::

::: fn len
param string: string - The value to get the length of.

> Returns the amount of characters in the passed string.

```gaug
var String = "Hello World";

print(len(String));
```
:::

::: fn wait
param time: number - Time to pause for.

> Pauses the current thread for the amount of time passed. 

```gaug
print("Started!");
wait(5);
print("Waited 5 seconds!");
```
:::

::: fn error
param message: string - The message to send.
param errorEnum: enum - One of the errors under `enum.errors`
param lineNumber?: number - Line number, must not be outside of the current source file.

> Stops current thread and prints an error message.

```gaug
attempt () -> (
    # do something here
) %except *e >>> string* -> (
    error(e, enum.errors.RUNTIME_ERROR, 2);
);
```
:::

::: fn type 
param val: super - The value to get the type of.

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

::: fn supertype 
param val: super - The value to get the type of.

> Returns the type of the passed value, can detect user-defined types and super.

```gaug
type new Player = {
    Name >>> string;
    Health >>> int;
};

var NewPlayer >>> Player = {
    ("Name") = "Player1";
    ("Health") = 50;
};

print(type(NewPlayer)); # dictionary
print(supertype(NewPlayer)); # Player
```