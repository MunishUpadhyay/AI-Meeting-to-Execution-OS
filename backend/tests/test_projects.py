def test_create_project(client):
    payload = {
        "name": "Payment Gateway Project",
        "description": "Implement payment processing"
    }
    response = client.post("/projects", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["description"] == payload["description"]
    assert "id" in data
    assert "created_at" in data


def test_create_project_validation_error(client):
    response = client.post("/projects", json={"name": ""})
    assert response.status_code == 422


def test_list_projects(client):
    client.post("/projects", json={"name": "Project A"})
    client.post("/projects", json={"name": "Project B"})
    response = client.get("/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_project_success(client):
    res = client.post("/projects", json={"name": "Project C"})
    project_id = res.json()["id"]

    response = client.get(f"/projects/{project_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Project C"


def test_get_project_not_found(client):
    response = client.get("/projects/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Project with ID 999 not found"


def test_delete_project(client):
    res = client.post("/projects", json={"name": "Project to Delete"})
    project_id = res.json()["id"]

    del_res = client.delete(f"/projects/{project_id}")
    assert del_res.status_code == 200

    get_res = client.get(f"/projects/{project_id}")
    assert get_res.status_code == 404


def test_delete_project_not_found(client):
    response = client.delete("/projects/999")
    assert response.status_code == 404
