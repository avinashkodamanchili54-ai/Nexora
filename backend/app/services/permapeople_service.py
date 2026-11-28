import httpx
import os
from typing import List, Dict

PERMAPIPEOPLE_BASE_URL = os.getenv("PERMAPIPEOPLE_BASE_URL", "https://api.permapeople.org/v1")

class PermapeopleService:
    """Simple wrapper around the free Permapeople plant API.
    Provides methods to fetch plant data and classify
    plants as "good" (beneficial) or "bad" (pest/weed) for a given crop.
    """

    @staticmethod
    async def fetch_plants(crop: str) -> List[Dict]:
        """Return raw plant entries for the specified crop.
        The real API supports a `/plants` endpoint with a `crop` query.
        """
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{PERMAPIPEOPLE_BASE_URL}/plants", params={"crop": crop})
            resp.raise_for_status()
            return resp.json().get("plants", [])

    @staticmethod
    async def classify_plants(crop: str) -> Dict[str, List[Dict]]:
        """Separate plants into beneficial (good) and harmful (bad).
        The Permapeople data includes a `role` field such as `companion`,
        `pest`, `weed`, etc. We treat `companion` and `beneficial` as good,
        everything else as bad.
        """
        plants = await PermapeopleService.fetch_plants(crop)
        good = []
        bad = []
        for p in plants:
            role = p.get("role", "").lower()
            if "companion" in role or "beneficial" in role:
                good.append(p)
            elif "pest" in role or "weed" in role:
                bad.append(p)
            else:
                # default to good if unknown
                good.append(p)
        return {"good": good, "bad": bad}
