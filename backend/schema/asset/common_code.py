from pydantic import BaseModel, ConfigDict


class AssetCommonCodeResponse(BaseModel):
    dtl_code: str
    dtl_code_name: str

    model_config = ConfigDict(from_attributes=True)


class AssetCommonCodeSaveRequest(BaseModel):
    codes: list[AssetCommonCodeResponse]
