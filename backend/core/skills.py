"""
Skill definitions — each skill describes its name, required fields,
the step-by-step question sequence, and the execution handler.

This is the "brain" of the adaptive dialogue: the planner reads these
to know what to ask next, one question at a time.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Any


@dataclass
class SkillStep:
    field_name: str           # key to store in collected_fields
    question: str             # what to ask the user
    question_hi: str = ""     # Hindi translation (optional)
    examples: str = ""        # example answer to show if confused
    optional: bool = False


@dataclass
class Skill:
    name: str
    display_name: str
    description: str          # used by intent classifier
    icon: str                 # emoji
    steps: list[SkillStep] = field(default_factory=list)
    requires_confirmation: bool = True
    confirmation_template: str = ""
    handler: Callable | None = None


# ── Skill Definitions ─────────────────────────────────────────────────────────

SKILLS: dict[str, Skill] = {
    "attendance": Skill(
        name="attendance",
        display_name="Take Attendance",
        description="Mark or take attendance for a class",
        icon="✅",
        steps=[
            SkillStep("class_name", "Which class?", "Kaunsa class?", "Example: Class 8"),
            SkillStep("section", "Which section?", "Kaunsa section?", "Example: Section A"),
            SkillStep("subject", "Which subject?", "Kaunsa subject?", "Example: Mathematics"),
            SkillStep("period", "Which period?", "Kaunsa period?", "Example: Period 2 or 10:00 AM"),
            SkillStep("date", "Which date? Say today for today.", "Kaunsi date?", "Example: Today or 15 July", optional=True),
        ],
        requires_confirmation=True,
        confirmation_template="I'll mark attendance for {class_name} {section}, {subject}, {period}. Is that correct?",
    ),

    "marks_entry": Skill(
        name="marks_entry",
        display_name="Enter Marks",
        description="Enter or update student marks or grades",
        icon="📝",
        steps=[
            SkillStep("class_name", "Which class?", "Kaunsa class?", "Example: Class 10"),
            SkillStep("subject", "Which subject?", "Kaunsa subject?", "Example: Science"),
            SkillStep("exam_type", "What type of exam?", "Kaun sa exam?", "Example: Unit Test, Mid-term, Final"),
        ],
        requires_confirmation=True,
        confirmation_template="I'll open marks entry for {class_name} — {subject} — {exam_type}. Shall I proceed?",
    ),

    "homework": Skill(
        name="homework",
        display_name="Assign Homework",
        description="Create or assign homework for a class",
        icon="📚",
        steps=[
            SkillStep("class_name", "Which class?", "Kaunsa class?", "Example: Class 7"),
            SkillStep("subject", "Which subject?", "Kaunsa subject?", "Example: English"),
            SkillStep("description", "What is the homework?", "Homework kya hai?", "Example: Read chapter 5 and answer questions"),
            SkillStep("due_date", "When is it due?", "Kab submit karna hai?", "Example: Tomorrow or Friday", optional=True),
        ],
        requires_confirmation=True,
        confirmation_template="I'll assign homework for {class_name} {subject}: '{description}'. Correct?",
    ),

    "schedule_reminder": Skill(
        name="schedule_reminder",
        display_name="Set Reminder",
        description="Set a reminder or schedule a meeting",
        icon="🔔",
        steps=[
            SkillStep("reminder_text", "What should I remind you about?", "Kya yaad dilaana hai?", "Example: Parent meeting, Staff meeting"),
            SkillStep("reminder_time", "When?", "Kab?", "Example: Tomorrow at 3 PM"),
        ],
        requires_confirmation=True,
        confirmation_template="I'll set a reminder: '{reminder_text}' at {reminder_time}. Is that right?",
    ),

    "lesson_plan": Skill(
        name="lesson_plan",
        display_name="Create Lesson Plan",
        description="Create or generate a lesson plan",
        icon="📖",
        steps=[
            SkillStep("class_name", "Which class?", "Kaunsa class?", "Example: Class 9"),
            SkillStep("subject", "Which subject?", "Kaunsa subject?", "Example: History"),
            SkillStep("topic", "What topic?", "Kaunsa topic?", "Example: World War II"),
            SkillStep("duration", "How long is the lesson?", "Kitna time?", "Example: 45 minutes", optional=True),
        ],
        requires_confirmation=False,
        confirmation_template="",
    ),

    "quiz": Skill(
        name="quiz",
        display_name="Take a Quiz",
        description="Student takes a quiz or practice test",
        icon="🧠",
        steps=[
            SkillStep("subject", "Which subject?", "Kaunsa subject?", "Example: Science"),
            SkillStep("topic", "Which topic?", "Kaunsa topic?", "Example: Photosynthesis"),
            SkillStep("difficulty", "Easy, medium, or hard?", "Kitna mushkil?", "Say: easy, medium, or hard", optional=True),
        ],
        requires_confirmation=False,
        confirmation_template="",
    ),

    "homework_help": Skill(
        name="homework_help",
        display_name="Homework Help",
        description="Student asks for help with homework or doubt",
        icon="🙋",
        steps=[
            SkillStep("question", "What is your question or doubt?", "Aapka sawaal kya hai?", "Example: How does photosynthesis work?"),
        ],
        requires_confirmation=False,
        confirmation_template="",
    ),

    "student_lookup": Skill(
        name="student_lookup",
        display_name="Student Lookup",
        description="Look up student information, attendance, or grades",
        icon="🔍",
        steps=[
            SkillStep("student_name", "Which student?", "Kaun sa student?", "Example: Arjun Sharma"),
            SkillStep("class_name", "Which class?", "Kaunsa class?", "Example: Class 8", optional=True),
        ],
        requires_confirmation=False,
        confirmation_template="",
    ),

    "voice_note": Skill(
        name="voice_note",
        display_name="Voice Note",
        description="Record a voice note or quick memo",
        icon="🎤",
        steps=[
            SkillStep("note_content", "What would you like to note down?", "Kya note karna hai?", "Speak your note now"),
        ],
        requires_confirmation=True,
        confirmation_template="I'll save this note: '{note_content}'. Correct?",
    ),

    "class_summary": Skill(
        name="class_summary",
        display_name="Class Summary",
        description="Generate a summary of today's class",
        icon="📊",
        steps=[
            SkillStep("class_name", "Which class?", "Kaunsa class?", "Example: Class 6"),
            SkillStep("subject", "Which subject?", "Kaunsa subject?", "Example: Maths"),
        ],
        requires_confirmation=False,
        confirmation_template="",
    ),
}


def get_skill(name: str) -> Skill | None:
    return SKILLS.get(name)


def all_skill_descriptions() -> str:
    """Used in intent classification prompt."""
    lines = []
    for s in SKILLS.values():
        lines.append(f"- {s.name}: {s.description}")
    return "\n".join(lines)
