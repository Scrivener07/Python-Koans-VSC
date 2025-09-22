"""
Parses a Python file to extract challenge functions and their metadata.
"""
import ast
import json
import sys

MEMBER_PATTERN:str = "challenge_"

def get_challenge_info(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        source = file.read()

    tree:ast.Module = ast.parse(source)
    challenges:list = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name.startswith(MEMBER_PATTERN):
            # Get docstring for member.
            docstring:str = ast.get_docstring(node) or ""

            # Get function body (indented code after the docstring)
            body_lines:list = []
            with open(file_path, "r", encoding="utf-8") as file:
                lines = file.readlines()

            start_line:int = node.body[0].lineno
            if isinstance(node.body[0], ast.Expr) and isinstance(node.body[0].value, ast.Constant):
                # Skip docstring
                if len(node.body) > 1:
                    start_line = node.body[1].lineno
                else:
                    start_line = node.body[0].end_lineno

            # Get indented body lines.
            for index in range(start_line - 1, len(lines)):
                if index >= len(lines) or (index > start_line - 1 and not lines[index].startswith(" ")):
                    break
                body_lines.append(lines[index])

            # Join body lines with proper indentation preserved.
            body:str = "".join(body_lines).rstrip()

            challenges.append({
                "name": node.name,
                "instruction": docstring,
                "code": body
            })

    return {"challenges": challenges}


# Entry Point
#--------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python parse_ast.py <python_file>")
        sys.exit(1)

    result:str = get_challenge_info(sys.argv[1])
    data:str = json.dumps(result)
    print(data)
