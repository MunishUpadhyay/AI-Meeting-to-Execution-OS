def test_create_decision_success(client):
    proj_res = client.post("/projects", json={"name": "Decision Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(f"/projects/{project_id}/meetings", json={"title": "Decision Meeting"})
    meeting_id = meet_res.json()["id"]

    payload = {"content": "Backend will use FastAPI."}
    response = client.post(f"/meetings/{meeting_id}/decisions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == payload["content"]
    assert data["meeting_id"] == meeting_id


def test_create_decision_meeting_not_found(client):
    response = client.post("/meetings/999/decisions", json={"content": "Orphan Decision"})
    assert response.status_code == 404


def test_list_meeting_decisions(client):
    proj_res = client.post("/projects", json={"name": "List Decision Project"})
    project_id = proj_res.json()["id"]

    meet_res = client.post(f"/projects/{project_id}/meetings", json={"title": "Decision List Meeting"})
    meeting_id = meet_res.json()["id"]

    client.post(f"/meetings/{meeting_id}/decisions", json={"content": "Decision 1"})
    client.post(f"/meetings/{meeting_id}/decisions", json={"content": "Decision 2"})

    response = client.get(f"/meetings/{meeting_id}/decisions")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_meeting_decisions_not_found(client):
    response = client.get("/meetings/999/decisions")
    assert response.status_code == 404
