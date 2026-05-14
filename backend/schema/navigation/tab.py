from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TabCreate(BaseModel):
    menu_id: str = Field(..., description="menu_id")
    tab_id: str = Field(..., description="tab_id")
    tab_name: str = Field(..., description="tab_name")
    href: str = Field(..., description="href")
    role: str = Field(default="ALL", description="role")
    use_yn: str = Field(default="Y", description="use_yn")
    seq: int = Field(..., description="seq")


class TabUpdate(BaseModel):
    use_yn: Optional[str] = Field(None, description="use_yn")
    seq: Optional[int] = Field(None, description="seq")


class TabResponse(BaseModel):
    id: int
    menu_id: str
    tab_id: str
    tab_name: str
    href: str
    role: str
    use_yn: Optional[str] = None
    seq: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
