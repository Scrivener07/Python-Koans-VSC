"""
Launches a koan test for a specific function and returns the result as JSON.
"""
import sys
import json
import os
import traceback
import unittest
import importlib.util
from typing import Any
from types import ModuleType
from importlib.machinery import ModuleSpec


class JSONTestResult(unittest.TestResult):
    """A custom unit test result collector."""
    def __init__(self):
        super().__init__()
        self.success = True
        self.message = ""

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self.success = False
        self.message = f"Test failed: {str(err[1])}"

    def addError(self, test, err):
        super().addError(test, err)
        self.success = False
        self.message = f"Error in test: {str(err[1])}"


class Message:
    """A data object for VS Code messaging."""
    def __init__(self, success:bool=False, message:str=""):
        self.success:bool = success
        self.message:str = message

    def encode(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "message": self.message
        }


class Program:

    @staticmethod
    def main(python_file:str, identity:str) -> Message:
        """
        Runs a specific test identified by the given `identity`.

        Args:
            python_file: Path to the Python file containing the function to test.
            identity: Test identifier in format `module.class.method`.

        Returns:
            A JSON serializable dictionary.
        """
        file_directory:str = os.path.dirname(os.path.abspath(python_file))
        try:
            # Add directories to Python `path` variable.
            Program.python_path_insert(file_directory)

            # Check if loading the module causes errors.
            module_error = Program.try_module(file_directory)
            if module_error:
                return module_error

            # Program.debug_only_print(file_directory, Program.identify_module(identity))

            # Start the unit test runner.
            return Program.start_test(identity)

        except Exception as exception:
            return Message(False, f"{str(exception)}\n{traceback.format_exc()}")


    @staticmethod
    def python_path_insert(file_directory:str) -> None:
        """Add the given directory to Python environment `path` variable."""
        if file_directory not in sys.path:
            sys.path.insert(0, file_directory)


    @staticmethod
    def identify_module(identity:str) -> str:
        """Get the module name component of the test identity."""
        # TODO: This is fragile, does not support nested module paths.
        parts:list[str] = identity.split('.')
        module_name:str = parts[0]
        print(f"module_name: ${module_name}")
        return module_name


    @staticmethod
    def try_module(directory:str) -> Message|None:
        """Try to import the koans testing module. Checks if loading the module causes errors."""
        filepath:str = os.path.join(directory, "koans", "testing.py")
        try:
            specification:ModuleSpec|None = importlib.util.spec_from_file_location(
                "koans.testing",
                filepath
            )
            module:ModuleType = importlib.util.module_from_spec(specification)
            specification.loader.exec_module(module)
            return None
        except ImportError as error:
            return Message(False, f"Could not import test module '{filepath}': {str(error)}")


    @staticmethod
    def start_test(identity:str) -> Message:
        # Load the test from its name.
        loader:unittest.TestLoader = unittest.TestLoader()
        suite:unittest.TestSuite = loader.loadTestsFromName(identity)

        # Make sure a unit test was found.
        if suite.countTestCases() == 0:
            return Message(False, f"No test found with identity: {identity}")

        # Run the test with custom result.
        result:JSONTestResult = JSONTestResult()
        suite.run(result)
        return Message(result.success, result.message)


    @staticmethod
    def debug_only_print(file_directory:str, module_name:str) -> None:
        print()
        print(f"DEBUG: Python path: {sys.path}", file=sys.stderr)
        print(f"DEBUG: Looking for module: {module_name}", file=sys.stderr)
        print(f"DEBUG: Working directory: {os.getcwd()}", file=sys.stderr)
        print(f"DEBUG: File directory: {file_directory}", file=sys.stderr)
        print()


# Entry Point
#--------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) != 3:
        error:Message = Message()
        error.success = False
        error.message = "Usage: python launcher.py <python_file_path> <test_identity>"
        print(json.dumps(error.encode()))
        sys.exit(1)

    python_file:str = sys.argv[1]
    identity:str = sys.argv[2]

    result:Message = Program.main(python_file, identity)
    data:str = json.dumps(result.encode())
    print(data)
