from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MenuCreate(BaseModel):
    menu_id: str = Field(..., description="menu_id")
    menu_name: str = Field(..., description="menu_name")
    href: str = Field(..., description="href")
    role: str = Field(default="ALL", description="role")
    use_yn: str = Field(default="Y", description="use_yn")
    seq: int = Field(..., description="seq")


class MenuUpdate(BaseModel):
    use_yn: Optional[str] = Field(None, description="use_yn")
    seq: Optional[int] = Field(None, description="seq")


class MenuResponse(BaseModel):
    id: int
    menu_id: str
    menu_name: str
    href: str
    role: str
    use_yn: Optional[str] = None
    seq: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
