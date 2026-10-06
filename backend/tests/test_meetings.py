def test_create_meeting_success(client):
    proj_res = client.post("/projects", json={"name": "Meeting Project"})
    project_id = proj_res.json()["id"]

    payload = {
        "title": "Backend Planning Meeting",
        "transcript": "The backend team discussed...",
        "summary": "Agreed on FastAPI architecture"
    }
    response = client.post(f"/projects/{project_id}/meetings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["project_id"] == project_id


def test_create_meeting_project_not_found(client):
    response = client.post("/projects/999/meetings", json={"title": "Orphan Meeting"})
    assert response.status_code == 404


def test_list_project_meetings(client):
    proj_res = client.post("/projects", json={"name": "Meeting List Project"})
    project_id = proj_res.json()["id"]

    client.post(f"/projects/{project_id}/meetings", json={"title": "Meeting 1"})
    client.post(f"/projects/{project_id}/meetings", json={"title": "Meeting 2"})

    response = client.get(f"/projects/{project_id}/meetings")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_project_meetings_not_found(client):
    response = client.get("/projects/999/meetings")
    assert response.status_code == 404


def test_get_meeting_success(client):
    proj_res = client.post("/projects", json={"name": "Get Meeting Project"})
    project_id = proj_res.json()["id"]

    m_res = client.post(f"/projects/{project_id}/meetings", json={"title": "Target Meeting"})
    meeting_id = m_res.json()["id"]

    response = client.get(f"/meetings/{meeting_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Target Meeting"


def test_get_meeting_not_found(client):
    response = client.get("/meetings/999")
    assert response.status_code == 404
