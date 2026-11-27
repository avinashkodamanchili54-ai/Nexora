import json
import shutil
from pathlib import Path
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from PIL import Image
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

BASE_DIR = Path("/Users/bokkadhanaraju/Documents/Nexora/Nexora")
SOURCE_PADDY = BASE_DIR / "source" / "paddy-disease-classification" / "train_images"
PROCESSED_PADDY = BASE_DIR / "processed" / "paddy_doctor"
MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp"}
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE


def prepare_paddy_doctor():
    if PROCESSED_PADDY.exists():
        print(f"[Paddy Doctor] Already prepared at {PROCESSED_PADDY}, skipping split.")
        return
    stats = {}
    corrupted_count = 0
    for class_dir in sorted(SOURCE_PADDY.iterdir()):
        if not class_dir.is_dir():
            continue
        valid = []
        for p in class_dir.iterdir():
            if p.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            try:
                with Image.open(p) as img:
                    img.verify()
                valid.append(p)
            except Exception:
                corrupted_count += 1
        if len(valid) < 3:
            continue
        train_files, temp_files = train_test_split(valid, test_size=0.30, random_state=42)
        val_files, test_files = train_test_split(temp_files, test_size=0.50, random_state=42)
        for split, flist in [("train", train_files), ("val", val_files), ("test", test_files)]:
            out_dir = PROCESSED_PADDY / split / class_dir.name
            out_dir.mkdir(parents=True, exist_ok=True)
            for f in flist:
                shutil.copy2(f, out_dir / f.name)
        stats[class_dir.name] = {
            "train": len(train_files),
            "val": len(val_files),
            "test": len(test_files),
        }
    (RESULTS_DIR / "paddy_doctor_eda.json").write_text(json.dumps(stats, indent=2))
    print(f"[Paddy Doctor] Classes: {len(stats)}, Corrupted: {corrupted_count}")


def load_data():
    train_ds = tf.keras.utils.image_dataset_from_directory(
        PROCESSED_PADDY / "train",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int",
        shuffle=True,
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        PROCESSED_PADDY / "val",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int",
        shuffle=False,
    )
    test_ds = tf.keras.utils.image_dataset_from_directory(
        PROCESSED_PADDY / "test",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int",
        shuffle=False,
    )
    classes = train_ds.class_names
    return (
        train_ds.prefetch(AUTOTUNE),
        val_ds.prefetch(AUTOTUNE),
        test_ds.prefetch(AUTOTUNE),
        classes,
    )


def build_model(num_classes: int):
    base_model = MobileNetV2(
        weights="imagenet", include_top=False, input_shape=(224, 224, 3)
    )
    base_model.trainable = False

    augmentation = models.Sequential(
        [
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.10),
            layers.RandomZoom(0.10),
            layers.RandomContrast(0.10),
        ]
    )

    inputs = layers.Input(shape=(224, 224, 3))
    x = augmentation(inputs)
    x = layers.Rescaling(1.0 / 127.5, offset=-1)(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.30)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, base_model


def plot_history(history, title: str, out_path: Path):
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(history.history["accuracy"], label="Train")
    plt.plot(history.history["val_accuracy"], label="Val")
    plt.title(f"{title} Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history["loss"], label="Train")
    plt.plot(history.history["val_loss"], label="Val")
    plt.title(f"{title} Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()

    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


if __name__ == "__main__":
    prepare_paddy_doctor()
    train_ds, val_ds, test_ds, classes = load_data()
    model, base_model = build_model(len(classes))

    best_path = MODELS_DIR / "paddy_doctor_best.keras"
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        ModelCheckpoint(str(best_path), monitor="val_loss", save_best_only=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=2, min_lr=1e-6),
    ]

    print(">>> Stage 1: Training Paddy Doctor (MobileNetV2)...")
    hist = model.fit(train_ds, validation_data=val_ds, epochs=15, callbacks=callbacks)
    plot_history(hist, "Paddy Doctor", RESULTS_DIR / "paddy_doctor_history.png")

    print(">>> Stage 2: Fine-tuning last 30 MobileNetV2 layers...")
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    fine_hist = model.fit(train_ds, validation_data=val_ds, epochs=10, callbacks=callbacks)
    plot_history(fine_hist, "Paddy Doctor Fine-Tune", RESULTS_DIR / "paddy_doctor_finetune_history.png")

    model.save(MODELS_DIR / "paddy_doctor_model.keras")

    y_true = np.concatenate([labels.numpy() for _, labels in test_ds])
    probs = model.predict(test_ds, verbose=0)
    y_pred = np.argmax(probs, axis=1)
    acc = float(accuracy_score(y_true, y_pred))
    report = classification_report(
        y_true, y_pred, labels=np.arange(len(classes)), target_names=classes, output_dict=True, zero_division=0
    )
    macro_f1 = float(report["macro avg"]["f1-score"])
    print(f"=== Paddy Doctor Test Accuracy: {acc:.4f} | Macro F1: {macro_f1:.4f} ===")

    cm = confusion_matrix(y_true, y_pred, labels=np.arange(len(classes)))
    plt.figure(figsize=(11, 9))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=classes, yticklabels=classes)
    plt.title("Paddy Doctor Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.xticks(rotation=45, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "paddy_doctor_cm.png", dpi=150)
    plt.close()

    # Merge safely into class_mapping.json & evaluation_summary.json
    cmap_path = MODELS_DIR / "class_mapping.json"
    cmap = json.loads(cmap_path.read_text()) if cmap_path.exists() else {}
    cmap["paddy_doctor"] = classes
    cmap_path.write_text(json.dumps(cmap, indent=4))

    eval_path = RESULTS_DIR / "evaluation_summary.json"
    eval_data = json.loads(eval_path.read_text()) if eval_path.exists() else {}
    eval_data["paddy_doctor"] = {"accuracy": acc, "macro_f1": macro_f1}
    eval_path.write_text(json.dumps(eval_data, indent=4))
    print("Paddy Doctor training, evaluation, and saving complete!")
