# Classes

::: warning
This documentation is currently outdated, please wait while I finish it.
:::

To create a new class, you must type `class ClassName -> ();`, just like how you would write functions but with `class` in the beginning.

::: details Example
```gaug
class ClassName -> ();

var NewClass = ClassName(); # to create a new instance of the class, use () just like how would do with functions.
```
:::

To create a global value inside a class, you need to use `global` before the variable/constant definition, if you do not include it then the definition will automatically be private to the class.

::: details Example
```gaug
class ClassName -> (
    global const Version = "1.0.0";
    private const Value = "5";
)

var Instance = ClassName();
print(Instance.Version); # works fine
print(Instance.Value); # runtime error, since its only accessible inside the class.
```
:::

To reference the class inside your class, you need to use `this`.

::: details Example
```gaug
class ClassName -> (
    global var Variable = "1";
    
    global func foo() -> (
        print(this::lineNumber); # returns the line number relative to the class
    );
);
```
:::

## CMethods
By default, cmethods are immutable/inassignable, unless for the init cmethod.

::: details Example
```gaug
class CMethodsExample -> (
    cmethod this::init() -> (
        print("A new version of this class has been made!"); # executes if the class is created.
    );
)


var Example = CMethodsExample(); # Output: A new version of this class has been made!
```
:::

If you wish to convert a class using a converter builtin (*ify fbuiltins). You can!

::: details Example
```gaug
class User -> (
    global var ID = 5000;

    cmethod this::stringify() -> (
        return stringify(this.ID); # returns the stringified ID
    );
)


var Example = stringify(User()); 
print(Example); # Output: 5000
```
:::