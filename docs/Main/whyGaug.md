# Gaug

Gaug is a lightweight, modern programming language designed to keep programming simple, readable, and enjoyable.

## Why Gaug?
### Simple Syntax
Gaug aims to make writing and reading code easier, with a custom syntax designed especially for the language instead of an inherited one.

### Lightweight Runtime
Gaug is built in C, keeping Gaug's core small and giving it a straightforward foundation for future optimization and embedding.

Language Speed based on Arithmetic, Arrays, Functions and String tests:
::: chart
"Benchmark","Runtime","Runs","MedianMs","MinMs","MaxMs"
"Arithmetic","C++","20","56.83","45.526","1100.926"
"Arithmetic","Luau","20","90.752","78.273","160.672"
"Arithmetic","Gaug","20","111.736","95.288","144.213"
"Arithmetic","Python","20","601.949","539.04","756.147"
"Arrays","C++","20","56.978","23.279","75.4"
"Arrays","Luau","20","88.952","35.442","109.1"
"Arrays","Python","20","272.366","87.174","316.482"
"Arrays","Gaug","20","2044.652","689.421","2257.296"
"Functions","C++","20","71.222","34.192","1063.11"
"Functions","Luau","20","213.56","59.296","250.647"
"Functions","Python","20","1077.532","334.462","1368.846"
"Functions","Gaug","20","12267.122","4369.228","14184.099"
"Strings","C++","20","54.093","48.52","71.827"
"Strings","Python","20","130.867","112.377","177.88"
"Strings","Luau","20","344.971","330.757","391.29"
"Strings","Gaug","20","384.486","361.743","436.345"

highlight Gaug
relative C++
speed
:::

### Built from Zero
Gaug has it's own lexer, parser, AST, evaluator, runtime and garbage collector. The language is built from the ground up to ensure full optimization.

### Developer-friendly Environment
Gaug has Visual Studio Code language support, syntax highlighting, autocompletion and dedicated documentation, with more tools being added to make the language evolve.


If you are interested. You can start from "[What is Gaug?](gaug)"