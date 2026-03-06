from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from database import get_mongo_db
from routers.auth import get_current_user
import schemas

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/students", response_model=List[schemas.User])
async def get_students_by_college(
    college: str,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    # Determine allowed college based on admin role
    if current_user.role == "college_admin_dkte":
        allowed_college = "DKTE textile and Engineering Institute"
    elif current_user.role == "college_admin_sharad":
        allowed_college = "Sharad Institute of technology"
    else:
        raise HTTPException(status_code=403, detail="Not authorized as a college admin")

    if college != allowed_college:
        raise HTTPException(status_code=403, detail="Not authorized to view students for this college")

    # Fetch all students for the specified college
    cursor = mongo_db.users.find({"role": "student", "college": college})
    students = await cursor.to_list(length=1000)
    
    # Format MongoDB docs to Pydantic objects
    for student in students:
        student['id'] = str(student['_id'])
        
    return [schemas.User(**student) for student in students]
