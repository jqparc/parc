from typing import Optional

from pydantic import BaseModel, ConfigDict


class BoardResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
