
def calculate_average(marks):
    if not marks:
        return 0

    return sum(marks) / len(marks)


def get_grade(average):
    if average >= 85:
        return "A"
    elif average >= 75:
        return "B"
    elif average >= 60:
        return "C"
    else:
        return "Fail"


def display_result(name, grade):
    print("Student:", name)
    print("Grade:", grade)


def main():
    student_name = "Ananya"
    marks = [85, 92, 78, 88, 95]

    average = calculate_average(marks)
    grade = get_grade(average)

    print("Average:", average)
    display_result(student_name, grade)


if __name__ == "__main__":
    main()
