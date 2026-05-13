"""应用程序入口"""
from sample_project.utils.calculator import add, multiply


def run():
    result = add(1, 2)
    doubled = multiply(result, 2)
    print(f"Result: {doubled}")


if __name__ == "__main__":
    run()
