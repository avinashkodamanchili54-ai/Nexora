import json
import shutil
from pathlib import Path
from PIL import Image
from sklearn.model_selection import train_test_split

BASE_DIR = Path("/Users/bokkadhanaraju/Documents/Nexora/Nexora")
SOURCE_DIR = BASE_DIR / "source"
PROCESSED_DIR = BASE_DIR / "processed"
RESULTS_DIR = BASE_DIR / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}


def verify_and_collect(class_dir: Path):
    valid_files = []
    corrupted = []
    for p in class_dir.rglob("*"):
        if p.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        try:
            with Image.open(p) as img:
                img.verify()
            valid_files.append(p)
        except Exception:
            corrupted.append(str(p))
    return valid_files, corrupted


def split_folder_dataset(src_root: Path, dst_root: Path, name: str):
    if dst_root.exists():
        print(f"[{name}] Already prepared at {dst_root}, skipping split.")
        return {}
    stats = {}
    corrupted_all = []
    for class_dir in sorted(src_root.iterdir()):
        if not class_dir.is_dir():
            continue
        files, corrupted = verify_and_collect(class_dir)
        corrupted_all.extend(corrupted)
        if len(files) < 3:
            continue
        train_files, temp_files = train_test_split(files, test_size=0.30, random_state=42)
        val_files, test_files = train_test_split(temp_files, test_size=0.50, random_state=42)
        for split, flist in [("train", train_files), ("val", val_files), ("test", test_files)]:
            out_dir = dst_root / split / class_dir.name
            out_dir.mkdir(parents=True, exist_ok=True)
            for f in flist:
                shutil.copy2(f, out_dir / f.name)
        stats[class_dir.name] = {
            "train": len(train_files),
            "val": len(val_files),
            "test": len(test_files),
        }
    print(f"[{name}] Classes: {len(stats)}, Corrupted: {len(corrupted_all)}")
    return stats


def prepare_plantdoc(src_root: Path, dst_root: Path):
    if dst_root.exists():
        print(f"[PlantDoc] Already prepared at {dst_root}, skipping split.")
        return {}
    stats = {}
    corrupted_all = []
    train_src = src_root / "train"
    test_src = src_root / "test"

    for class_dir in sorted(train_src.iterdir()):
        if not class_dir.is_dir():
            continue
        files, corrupted = verify_and_collect(class_dir)
        corrupted_all.extend(corrupted)
        if len(files) < 2:
            continue
        train_files, val_files = train_test_split(files, test_size=0.15, random_state=42)
        for split, flist in [("train", train_files), ("val", val_files)]:
            out_dir = dst_root / split / class_dir.name
            out_dir.mkdir(parents=True, exist_ok=True)
            for f in flist:
                shutil.copy2(f, out_dir / f.name)
        stats[class_dir.name] = {"train": len(train_files), "val": len(val_files), "test": 0}

    for class_dir in sorted(test_src.iterdir()):
        if not class_dir.is_dir():
            continue
        files, corrupted = verify_and_collect(class_dir)
        corrupted_all.extend(corrupted)
        out_dir = dst_root / "test" / class_dir.name
        out_dir.mkdir(parents=True, exist_ok=True)
        for f in files:
            shutil.copy2(f, out_dir / f.name)
        if class_dir.name in stats:
            stats[class_dir.name]["test"] = len(files)

    print(f"[PlantDoc] Classes: {len(stats)}, Corrupted: {len(corrupted_all)}")
    return stats


if __name__ == "__main__":
    summary = {
        "rice": split_folder_dataset(
            SOURCE_DIR / "rice+leaf+diseases", PROCESSED_DIR / "rice", "Rice"
        ),
        "plantdoc": prepare_plantdoc(
            SOURCE_DIR / "PlantDoc-Dataset-master", PROCESSED_DIR / "plantdoc"
        ),
        "plantvillage": split_folder_dataset(
            SOURCE_DIR / "plantvillage dataset" / "color",
            PROCESSED_DIR / "plantvillage",
            "PlantVillage",
        ),
    }
    (RESULTS_DIR / "eda_summary.json").write_text(json.dumps(summary, indent=2))
    print("EDA & dataset preparation complete!")
