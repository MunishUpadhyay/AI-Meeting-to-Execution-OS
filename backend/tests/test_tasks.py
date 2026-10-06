def test_create_task_success(client):
    proj_res = client.post("/projects", json={"name": "Task Project"})
    project_id = proj_res.json()["id"]

    payload = {
        "title": "Implement payment API",
        "owner": "Rahul",
        "deadline": "2026-10-08",
        "status": "TODO",
        "priority": "HIGH",
        "dependency": "Database schema"
    }
    response = client.post(f"/projects/{project_id}/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["owner"] == payload["owner"]
    assert data["status"] == "TODO"
    assert data["priority"] == "HIGH"


def test_create_task_with_meeting(client):
    proj_res = client.post("/projects", json={"name": "Task Meeting Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(f"/projects/{project_id}/meetings", json={"title": "Sprint Planning"})
    meeting_id = meet_res.json()["id"]

    payload = {
        "meeting_id": meeting_id,
        "title": "Create User Auth",
        "status": "IN_PROGRESS",
        "priority": "MEDIUM"
    }
    response = client.post(f"/projects/{project_id}/tasks", json=payload)
    assert response.status_code == 201
    assert response.json()["meeting_id"] == meeting_id


def test_create_task_project_not_found(client):
    response = client.post("/projects/999/tasks", json={"title": "Orphan Task"})
    assert response.status_code == 404


def test_create_task_invalid_status(client):
    proj_res = client.post("/projects", json={"name": "Validation Project"})
    project_id = proj_res.json()["id"]

    response = client.post(
        f"/projects/{project_id}/tasks",
        json={"title": "Bad Task", "status": "UNKNOWN_STATUS"}
    )
    assert response.status_code == 422


def test_list_project_tasks(client):
    proj_res = client.post("/projects", json={"name": "List Task Project"})
    project_id = proj_res.json()["id"]

    client.post(f"/projects/{project_id}/tasks", json={"title": "Task 1"})
    client.post(f"/projects/{project_id}/tasks", json={"title": "Task 2"})

    response = client.get(f"/projects/{project_id}/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_task_success(client):
    proj_res = client.post("/projects", json={"name": "Get Task Project"})
    project_id = proj_res.json()["id"]

    task_res = client.post(f"/projects/{project_id}/tasks", json={"title": "Single Task"})
    task_id = task_res.json()["id"]

    response = client.get(f"/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Single Task"


def test_get_task_not_found(client):
    response = client.get("/tasks/999")
    assert response.status_code == 404


def test_patch_task(client):
    proj_res = client.post("/projects", json={"name": "Patch Task Project"})
    project_id = proj_res.json()["id"]

    task_res = client.post(f"/projects/{project_id}/tasks", json={"title": "Original Task", "status": "TODO"})
    task_id = task_res.json()["id"]

    patch_payload = {
        "status": "DONE",
        "priority": "HIGH",
        "owner": "Priya",
        "dependency": "None"
    }
    response = client.patch(f"/tasks/{task_id}", json=patch_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "DONE"
    assert data["priority"] == "HIGH"
    assert data["owner"] == "Priya"


def test_patch_task_not_found(client):
    response = client.patch("/tasks/999", json={"status": "DONE"})
    assert response.status_code == 404
