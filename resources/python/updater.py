"""
Updates a specific function in a Python file while maintaining code structure.
"""
import ast
import sys


class Program:

    def main(file_path:str, function_name:str, new_body_code:str):
        """
        Updates a function's body while preserving its structure and docstring.
        """
        # Read the Python file content as lines
        with open(file_path, "r", encoding="utf-8") as file:
            lines = file.readlines()

        # Parse the file into an AST
        source:str = "".join(lines)
        module:ast.Module = ast.parse(source)

        # Find the target function
        target_function:ast.FunctionDef = None
        for node in ast.walk(module):
            if isinstance(node, ast.FunctionDef) and node.name == function_name:
                target_function = node
                break

        if not target_function:
            raise ValueError(f"Function '{function_name}' not found in the file")

        # Get function start and end lines (0-indexed)
        start_line:int = target_function.lineno - 1
        end_line:int = target_function.end_lineno - 1

        # Get function definition indentation
        function_indent:int = len(lines[start_line]) - len(lines[start_line].lstrip())
        body_indent:int = function_indent + 4  # Standard Python indentation

        # Prepare the new body code with proper indentation
        indent_str:str = " " * body_indent
        new_body_lines:list[str] = []
        for line in new_body_code.split("\n"):
            if line.strip():  # If not an empty line
                new_body_lines.append(f"{indent_str}{line.strip()}")
            else:
                new_body_lines.append("")

        # Check if the function has a docstring
        doc_string_end:int = start_line
        doc_marker:bool = False
        for index in range(start_line + 1, end_line + 1):
            doc_line:str = lines[index].strip()
            if doc_line.startswith('"""') or doc_line.startswith("'''"):
                doc_marker = not doc_marker
                doc_string_end = index
                if not doc_marker:
                    break
            elif doc_marker:
                doc_string_end = index

        # If docstring was found, preserve it and only replace function body
        new_lines:list[str] = []
        if doc_string_end > start_line:
            # Keep function definition and docstring
            new_lines = lines[:doc_string_end + 1]
            # Add new body
            new_lines.extend([line + "\n" for line in new_body_lines])
            # Add remaining content after the function
            if end_line + 1 < len(lines):
                new_lines.extend(lines[end_line + 1:])
        else:
            # No docstring, replace after function definition line
            new_lines = lines[:start_line + 1]  # Keep function definition
            new_lines.extend([line + "\n" for line in new_body_lines])
            # Add remaining content after the function
            if end_line + 1 < len(lines):
                new_lines.extend(lines[end_line + 1:])

        return "".join(new_lines)


# Entry Point
#--------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python updater.py <file_path> <function_name> <new_code>")
        sys.exit(1)

    file_path:str = sys.argv[1]
    function_name:str = sys.argv[2]
    new_body_code:str = sys.argv[3]

    try:
        updated_content:str = Program.main(file_path, function_name, new_body_code)
        print(updated_content)
    except Exception as exception:
        sys.stderr.write(f"Error: {str(exception)}\n")
        sys.exit(1)
