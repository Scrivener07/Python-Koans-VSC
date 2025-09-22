"""
Executes a single koan test and returns the result.
"""
import sys
import json
from typing import Any
from types import ModuleType
import unittest
from unittest import TestLoader, TextTestRunner, TestSuite
import importlib.util
from importlib.machinery import ModuleSpec

# A little hack to get some data into SingleTest.
class SingleTestData:
    test_module:ModuleType|None = None
    test_challenge_id:str = ""


# Create a test case that runs just the specified function.
class SingleTest(unittest.TestCase):

    def test_challenge(self):
        # Call the function and check the result.
        # This is a simplified dummy example for dev testing.
        self.module = SingleTestData.test_module
        self.challenge_id = SingleTestData.test_challenge_id
        function = getattr(self.module, self.challenge_id)
        result = function()
        self.assertTrue(result is not None)


class Runner:

    def run(python_file:str, challenge_id:str) -> dict[str, Any]:
        # Dynamically import the Python file.
        module_name:str = challenge_id
        spec:ModuleSpec|None = importlib.util.spec_from_file_location(module_name, python_file)
        module:ModuleType = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        SingleTestData.test_module = module
        SingleTestData.test_challenge_id = challenge_id

        # Run the test
        loader:TestLoader = TestLoader()
        try:
            suite:TestSuite = loader.loadTestsFromTestCase(SingleTest)
            runner:TextTestRunner = TextTestRunner(verbosity=2)
            result = runner.run(suite)
        except Exception as exception:
            return {
                "success": False,
                "message": str(exception)
            }

        # Format the result
        if result.wasSuccessful():
            return {
                "success": True,
                "message": "Test passed successfully!"
            }
        else:
            error_msg:str = ""
            if result.errors:
                error_msg = str(result.errors[0][1])
            else:
                error_msg = str(result.failures[0][1])
            return {
                "success": False,
                "message": error_msg
            }



# Entry Point
#--------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) != 3:
        message_fail = {
            "success": False,
            "message": "Usage: python run_test.py <python_file> <challenge_id>"
        }
        print(json.dumps(message_fail))
        sys.exit(1)

    result:dict[str, Any] = Runner.run(sys.argv[1], sys.argv[2])
    result_json:str = json.dumps(result)
    print(result_json)
