from . import event, holiday

router = event.router

router.include_router(holiday.router)

__all__ = ["router"]
