from datetime import date, datetime, timedelta
from typing import Sequence
from app.models import Task
from app.schemas.risk import (
    Risk,
    RiskSeverity,
    RiskType,
    ProjectRiskSummary,
    ProjectRisksResponse,
)


def parse_date(date_str: str | None) -> date | None:
    if not date_str or not date_str.strip():
        return None
    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        return None


class RiskEngine:
    @staticmethod
    def evaluate_project_risks(
        project_id: int,
        tasks: Sequence[Task],
        today_date: date | None = None,
    ) -> ProjectRisksResponse:
        current_date = today_date or date.today()

        # Build normalized task title lookup for dependency resolution
        title_map: dict[str, Task] = {}
        for t in tasks:
            if t.title and t.title.strip():
                norm_title = t.title.strip().lower()
                # If multiple tasks exist, prefer one that is not DONE or keep the first
                if norm_title not in title_map or title_map[norm_title].status == "DONE":
                    title_map[norm_title] = t

        risks: list[Risk] = []
        total_tasks = len(tasks)
        completed_tasks = 0
        in_progress_tasks = 0
        blocked_tasks = 0
        overdue_tasks = 0

        for task in tasks:
            status_upper = (task.status or "").upper()
            priority_upper = (task.priority or "").upper()
            d_date = parse_date(task.deadline)

            # Update status metrics
            if status_upper == "DONE":
                completed_tasks += 1
            elif status_upper == "IN_PROGRESS":
                in_progress_tasks += 1
            elif status_upper == "BLOCKED":
                blocked_tasks += 1

            # Check overdue count
            is_overdue = d_date is not None and d_date < current_date and status_upper != "DONE"
            if is_overdue:
                overdue_tasks += 1

            task_has_high_severity_risk = False

            # RULE 1 — BLOCKED TASK
            if status_upper == "BLOCKED":
                risks.append(
                    Risk(
                        type=RiskType.BLOCKED_TASK,
                        severity=RiskSeverity.HIGH,
                        title="Blocked task",
                        description=f"Task '{task.title}' is currently blocked.",
                        related_task_id=task.id,
                        related_task_title=task.title,
                    )
                )
                task_has_high_severity_risk = True

            # RULE 2 — OVERDUE TASK
            if is_overdue:
                risks.append(
                    Risk(
                        type=RiskType.OVERDUE_TASK,
                        severity=RiskSeverity.HIGH,
                        title="Overdue task",
                        description=f"Task '{task.title}' was due on {task.deadline} and is past due.",
                        related_task_id=task.id,
                        related_task_title=task.title,
                    )
                )
                task_has_high_severity_risk = True

            # RULE 3 — UNRESOLVED DEPENDENCY
            if task.dependency and task.dependency.strip() and status_upper != "DONE":
                dep_raw = task.dependency.strip()
                dep_key = dep_raw.lower()
                matched_task = title_map.get(dep_key)

                if matched_task and matched_task.id != task.id:
                    if matched_task.status.upper() != "DONE":
                        risks.append(
                            Risk(
                                type=RiskType.DEPENDENCY_RISK,
                                severity=RiskSeverity.HIGH,
                                title="Unresolved dependency",
                                description=(
                                    f"Task '{task.title}' depends on '{matched_task.title}' "
                                    f"which is currently {matched_task.status}."
                                ),
                                related_task_id=task.id,
                                related_task_title=task.title,
                                dependency_task_id=matched_task.id,
                                dependency_task_title=matched_task.title,
                            )
                        )
                        task_has_high_severity_risk = True
                else:
                    # Unmatched dependency reference
                    risks.append(
                        Risk(
                            type=RiskType.UNRESOLVED_DEPENDENCY_REFERENCE,
                            severity=RiskSeverity.MEDIUM,
                            title="Unresolved dependency reference",
                            description=(
                                f"Task '{task.title}' references dependency '{dep_raw}' "
                                "which could not be matched to an existing task in this project."
                            ),
                            related_task_id=task.id,
                            related_task_title=task.title,
                        )
                    )

            # RULE 4 — APPROACHING DEADLINE
            if (
                status_upper != "DONE"
                and d_date is not None
                and current_date <= d_date <= current_date + timedelta(days=2)
            ):
                risks.append(
                    Risk(
                        type=RiskType.APPROACHING_DEADLINE,
                        severity=RiskSeverity.MEDIUM,
                        title="Approaching deadline",
                        description=f"Task '{task.title}' has an approaching deadline of {task.deadline}.",
                        related_task_id=task.id,
                        related_task_title=task.title,
                    )
                )

            # RULE 5 — HIGH-PRIORITY INCOMPLETE TASK
            if (
                priority_upper == "HIGH"
                and status_upper != "DONE"
                and not task_has_high_severity_risk
            ):
                risks.append(
                    Risk(
                        type=RiskType.HIGH_PRIORITY_INCOMPLETE,
                        severity=RiskSeverity.MEDIUM,
                        title="High-priority task incomplete",
                        description=f"High-priority task '{task.title}' is still incomplete.",
                        related_task_id=task.id,
                        related_task_title=task.title,
                    )
                )

        high_risk_count = sum(1 for r in risks if r.severity == RiskSeverity.HIGH)
        medium_risk_count = sum(1 for r in risks if r.severity == RiskSeverity.MEDIUM)

        summary = ProjectRiskSummary(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            in_progress_tasks=in_progress_tasks,
            blocked_tasks=blocked_tasks,
            overdue_tasks=overdue_tasks,
            risk_count=len(risks),
            high_risk_count=high_risk_count,
            medium_risk_count=medium_risk_count,
        )

        return ProjectRisksResponse(
            project_id=project_id,
            summary=summary,
            risks=risks,
        )
