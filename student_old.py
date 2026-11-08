
def calculate_average(marks):
    if not marks:
        return 0

    return sum(marks) / len(marks)


def get_grade(average):
    if average >= 90:
        return "A"
    elif average >= 75:
        return "B"
    elif average >= 60:
        return "C"
    else:
        return "Fail"


def main():
    student_name = "Ananya"
    marks = [85, 92, 78, 88, 95]

    average = calculate_average(marks)
    grade = get_grade(average)

    print("Student:", student_name)
    print("Average:", average)
    print("Grade:", grade)


if __name__ == "__main__":
    main()
