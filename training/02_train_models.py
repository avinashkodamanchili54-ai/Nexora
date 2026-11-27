import json
from pathlib import Path
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

BASE_DIR = Path("/Users/bokkadhanaraju/Documents/Nexora/Nexora")
PROCESSED_DIR = BASE_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE


def load_dataset(path: Path):
    train_ds = tf.keras.utils.image_dataset_from_directory(
        path / "train",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int",
        shuffle=True,
        seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        path / "val",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int",
        shuffle=False,
    )
    test_ds = tf.keras.utils.image_dataset_from_directory(
        path / "test",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode="int",
        shuffle=False,
    )
    class_names = train_ds.class_names
    return (
        train_ds.prefetch(AUTOTUNE),
        val_ds.prefetch(AUTOTUNE),
        test_ds.prefetch(AUTOTUNE),
        class_names,
    )


def build_model(num_classes: int, lr: float = 0.001):
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
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, base_model


def plot_training(history, title: str, out_path: Path):
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


def evaluate_model(model, test_ds, class_names, name: str):
    y_true = np.concatenate([labels.numpy() for _, labels in test_ds])
    probs = model.predict(test_ds, verbose=0)
    y_pred = np.argmax(probs, axis=1)

    acc = float(accuracy_score(y_true, y_pred))
    report = classification_report(
        y_true,
        y_pred,
        labels=np.arange(len(class_names)),
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )
    print(f"\n=== {name} Test Accuracy: {acc:.4f} | Macro F1: {report['macro avg']['f1-score']:.4f} ===")

    cm = confusion_matrix(y_true, y_pred, labels=np.arange(len(class_names)))
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=len(class_names) <= 15, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names)
    plt.title(f"{name} Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.xticks(rotation=90)
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / f"{name.lower().replace(' ', '_')}_cm.png", dpi=150)
    plt.close()

    return {"accuracy": acc, "macro_f1": float(report["macro avg"]["f1-score"]), "report": report}


def train_pipeline(
    key: str,
    title: str,
    epochs: int,
    fine_tune_epochs: int,
    lr: float,
    patience: int,
):
    print(f"\n>>> Starting training for {title}...")
    train_ds, val_ds, test_ds, classes = load_dataset(PROCESSED_DIR / key)
    model, base_model = build_model(len(classes), lr=lr)

    best_path = MODELS_DIR / f"{key}_best.keras"
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=patience, restore_best_weights=True),
        ModelCheckpoint(str(best_path), monitor="val_loss", save_best_only=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=2, min_lr=1e-6),
    ]

    history = model.fit(train_ds, validation_data=val_ds, epochs=epochs, callbacks=callbacks)
    plot_training(history, title, RESULTS_DIR / f"{key}_history.png")

    if fine_tune_epochs > 0:
        base_model.trainable = True
        for layer in base_model.layers[:-30]:
            layer.trainable = False
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )
        fine_history = model.fit(
            train_ds, validation_data=val_ds, epochs=fine_tune_epochs, callbacks=callbacks
        )
        plot_training(fine_history, f"{title} Fine-Tune", RESULTS_DIR / f"{key}_finetune_history.png")

    final_path = MODELS_DIR / f"{key}_model.keras"
    model.save(final_path)
    metrics = evaluate_model(model, test_ds, classes, title)
    return classes, metrics


if __name__ == "__main__":
    print("TensorFlow:", tf.__version__, "| GPUs:", tf.config.list_physical_devices("GPU"))
    class_mapping = {}
    eval_summary = {}

    # 1. Rice Leaf Disease (fast, 3 classes)
    rice_classes, rice_metrics = train_pipeline(
        key="rice", title="Rice Leaf Disease", epochs=30, fine_tune_epochs=0, lr=1e-4, patience=8
    )
    class_mapping["rice"] = rice_classes
    eval_summary["rice"] = {"accuracy": rice_metrics["accuracy"], "macro_f1": rice_metrics["macro_f1"]}

    # 2. PlantDoc (real-world field images)
    doc_classes, doc_metrics = train_pipeline(
        key="plantdoc", title="PlantDoc", epochs=25, fine_tune_epochs=10, lr=1e-3, patience=5
    )
    class_mapping["plantdoc"] = doc_classes
    eval_summary["plantdoc"] = {"accuracy": doc_metrics["accuracy"], "macro_f1": doc_metrics["macro_f1"]}

    # 3. PlantVillage (large general crop dataset)
    pv_classes, pv_metrics = train_pipeline(
        key="plantvillage", title="PlantVillage", epochs=15, fine_tune_epochs=10, lr=1e-3, patience=5
    )
    class_mapping["plantvillage"] = pv_classes
    eval_summary["plantvillage"] = {"accuracy": pv_metrics["accuracy"], "macro_f1": pv_metrics["macro_f1"]}

    (MODELS_DIR / "class_mapping.json").write_text(json.dumps(class_mapping, indent=4))
    (RESULTS_DIR / "evaluation_summary.json").write_text(json.dumps(eval_summary, indent=4))
    print("\nAll models trained, evaluated, and saved successfully!")
