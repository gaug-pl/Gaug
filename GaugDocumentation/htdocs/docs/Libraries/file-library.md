# File Library
This library is used for handling files in Gaug.

::: warning
Attempting to access the `file` library while in safe mode will result in errors!
:::

## `file.read(path: string)`
> Returns the file's contents as a string.

```gaug
# Example.gaug
var module = {};
module<"Variable1"> = 5
module<"Variable2"> = "5"

return module;

# main.gaug
var Contents = file.read("./modules/Example.gaug")
print(Contents)
```

`Output:`
```
var module = {};
module<"Variable1"> = 5
module<"Variable2"> = "5"

return module;
```

## `file.write(path: string, newContent: string)`
> Returns the file's contents as a string.

```gaug
# Example.gaug
var module = {};
module<"Variable1"> = 5;
module<"Variable2"> = "5";

return module;

# main.gaug
var PreviousContents = file.read("./modules/Example.gaug");
file.write("./modules/Example.gaug", "print('Hello!'); ");

var NewContent = file.read("./modules/Example.gaug");
print("Previous:" PreviousContents, "new:", NewContent);
```

`Output:`
```
Previous: 
var module = {};
module<"Variable1"> = 5;
module<"Variable2"> = "5";

return module; 
New: print('Hello!');
```

## `file.append(path: string, newContent: string)`
> Appends a line to a file.

```gaug
# Example.gaug
var module = {};
module<"Variable1"> = 5;
module<"Variable2"> = "5";

return module;

# main.gaug
var PreviousContents = file.read("./modules/Example.gaug");
file.append("./modules/Example.gaug", "print('Hello!'); ");

var NewContent = file.read("./modules/Example.gaug");
print("Previous:" PreviousContents, "New:", NewContent);
```

`Output:`
```
Previous: 
var module = {};
module<"Variable1"> = 5;
module<"Variable2"> = "5";

New: 
var module = {};
module<"Variable1"> = 5;
module<"Variable2"> = "5";
print('Hello!');

```

## `file.exists(path: string)`
> Checks if a file exists.

```gaug
var Exists = file.exists("./modules/Example.gaug");
print(Exists);
```

`Output: true`

## `file.size(path: string)`
> Returns the passed file's size in bytes.

```gaug
var Exists = file.size("./modules/Example.gaug");
print(Exists);
```

`Output: 37`

## `file.remove(path: string)`
> Deletes the file.

## `file.lines(path: string)`
> Returns a list containing every line of the passed file.

```gaug
## Example.gaug
const x = 5;
print("Hello!");

## main.gaug
var Lines = file.lines("./Example.gaug");
print(Lines);
```

`Output: [const x = 5;, print("Hello!");]`