import json
from pathlib import Path
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

BASE_DIR = Path("/Users/bokkadhanaraju/Documents/Nexora/Nexora")
PROCESSED_DIR = BASE_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE


def load_splits(key: str):
    path = PROCESSED_DIR / key
    train_ds = tf.keras.utils.image_dataset_from_directory(
        path / "train", image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode="int", shuffle=True, seed=42
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        path / "val", image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode="int", shuffle=False
    )
    test_ds = tf.keras.utils.image_dataset_from_directory(
        path / "test", image_size=IMG_SIZE, batch_size=BATCH_SIZE, label_mode="int", shuffle=False
    )
    classes = train_ds.class_names
    return train_ds.prefetch(AUTOTUNE), val_ds.prefetch(AUTOTUNE), test_ds.prefetch(AUTOTUNE), classes


def evaluate_and_save_cm(model, test_ds, classes, name: str):
    y_true = np.concatenate([labels.numpy() for _, labels in test_ds])
    probs = model.predict(test_ds, verbose=0)
    y_pred = np.argmax(probs, axis=1)
    acc = float(accuracy_score(y_true, y_pred))
    report = classification_report(
        y_true, y_pred, labels=np.arange(len(classes)), target_names=classes, output_dict=True, zero_division=0
    )
    macro_f1 = float(report["macro avg"]["f1-score"])
    print(f"=== {name} Test Accuracy: {acc:.4f} | Macro F1: {macro_f1:.4f} ===")

    cm = confusion_matrix(y_true, y_pred, labels=np.arange(len(classes)))
    plt.figure(figsize=(14, 11))
    sns.heatmap(cm, annot=len(classes) <= 15, fmt="d", cmap="Blues", xticklabels=classes, yticklabels=classes)
    plt.title(f"{name} Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.xticks(rotation=90)
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / f"{name.lower().replace(' ', '_')}_cm.png", dpi=150)
    plt.close()
    return {"accuracy": acc, "macro_f1": macro_f1}


if __name__ == "__main__":
    pv_train, pv_val, pv_test, pv_classes = load_splits("plantvillage")
    pv_model = tf.keras.models.load_model(MODELS_DIR / "plantvillage_best.keras")

    # Fine-tune top 30 layers of MobileNetV2 base
    for layer in pv_model.layers:
        if "mobilenetv2" in layer.name.lower():
            layer.trainable = True
            for sub in layer.layers[:-30]:
                sub.trainable = False

    pv_model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    callbacks = [
        EarlyStopping(monitor="val_loss", patience=3, restore_best_weights=True),
        ModelCheckpoint(str(MODELS_DIR / "plantvillage_best.keras"), monitor="val_loss", save_best_only=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.2, patience=2, min_lr=1e-6),
    ]
    pv_model.fit(pv_train, validation_data=pv_val, epochs=5, callbacks=callbacks)
    pv_model.save(MODELS_DIR / "plantvillage_model.keras")

    # Evaluate all 3 models & write unified class_mapping.json + evaluation_summary.json
    _, _, rice_test, rice_classes = load_splits("rice")
    _, _, doc_test, doc_classes = load_splits("plantdoc")
    rice_model = tf.keras.models.load_model(MODELS_DIR / "rice_model.keras")
    doc_model = tf.keras.models.load_model(MODELS_DIR / "plantdoc_model.keras")

    eval_summary = {
        "rice": evaluate_and_save_cm(rice_model, rice_test, rice_classes, "Rice Leaf Disease"),
        "plantdoc": evaluate_and_save_cm(doc_model, doc_test, doc_classes, "PlantDoc"),
        "plantvillage": evaluate_and_save_cm(pv_model, pv_test, pv_classes, "PlantVillage"),
    }
    class_mapping = {
        "rice": rice_classes,
        "plantdoc": doc_classes,
        "plantvillage": pv_classes,
    }
    (MODELS_DIR / "class_mapping.json").write_text(json.dumps(class_mapping, indent=4))
    (RESULTS_DIR / "evaluation_summary.json").write_text(json.dumps(eval_summary, indent=4))
    print("Finalized all 3 models and saved class_mapping.json + evaluation_summary.json!")
