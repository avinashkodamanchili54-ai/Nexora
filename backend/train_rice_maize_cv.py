import os
import sys
import json
import time
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, Subset
from torchvision import models, transforms
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

DATASET_ROOT = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/source/Rice_and_Maize_Dataset"
OUTPUT_DIR = "/Users/bokkadhanaraju/Documents/Nexora/Nexora/models/trained_rice_maize"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Select Device: Apple Silicon MPS if available, otherwise CPU
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using compute device: {device}")

# Define Dataset Scanner
class ImageFolderFlatDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        image = Image.open(path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, label

def collect_samples(crop_name):
    crop_dir = os.path.join(DATASET_ROOT, crop_name)
    samples = []
    class_names = []
    
    # We collect all subdirectories that contain images
    for root, dirs, files in os.walk(crop_dir):
        img_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if img_files:
            rel = os.path.relpath(root, crop_dir)
            # Clean class label: e.g. "Disease/01_Bacterial_leaf_blight" -> "Bacterial_leaf_blight"
            clean_name = os.path.basename(root)
            # Remove leading numbers like 01_, 02_
            if clean_name[:2].isdigit() and clean_name[2] == '_':
                clean_name = clean_name[3:]
            
            category = os.path.dirname(rel)
            full_label = f"{crop_name} - {clean_name.replace('_', ' ').title()}"
            if full_label not in class_names:
                class_names.append(full_label)
            cls_idx = class_names.index(full_label)
            for f in img_files:
                samples.append((os.path.join(root, f), cls_idx))
                
    return samples, class_names

# Transforms
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def train_crop_with_kfold(crop_name, n_splits=5, epochs=10, batch_size=16):
    print(f"\n=======================================================")
    print(f"  STARTING {n_splits}-FOLD CROSS-VALIDATION FOR: {crop_name}")
    print(f"=======================================================")
    
    samples, class_names = collect_samples(crop_name)
    print(f"Total samples for {crop_name}: {len(samples)} across {len(class_names)} classes:")
    for idx, c in enumerate(class_names):
        count = sum(1 for _, l in samples if l == idx)
        print(f"  [{idx}] {c}: {count} images")
        
    labels = [s[1] for s in samples]
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    fold_accuracies = []
    best_overall_acc = 0.0
    best_model_path = os.path.join(OUTPUT_DIR, f"{crop_name.lower()}_best_cv_model.pt")
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(samples, labels)):
        print(f"\n--- Fold {fold + 1}/{n_splits} ---")
        
        train_samples = [samples[i] for i in train_idx]
        val_samples = [samples[i] for i in val_idx]
        
        train_dataset = ImageFolderFlatDataset(train_samples, transform=train_transform)
        val_dataset = ImageFolderFlatDataset(val_samples, transform=val_transform)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # Build Pretrained Model: MobileNetV2 (matching Nexora edge architecture)
        model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        # Replace classifier
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(in_features, len(class_names))
        )
        model = model.to(device)
        
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
        
        best_val_acc = 0.0
        
        for epoch in range(1, epochs + 1):
            model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            
            for imgs, lbls in train_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                optimizer.zero_grad()
                outputs = model(imgs)
                loss = criterion(outputs, lbls)
                loss.backward()
                optimizer.step()
                
                running_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(outputs, 1)
                correct += (preds == lbls).sum().item()
                total += lbls.size(0)
                
            scheduler.step()
            train_acc = correct / total
            
            # Validation
            model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0
            all_preds = []
            all_targets = []
            
            with torch.no_grad():
                for imgs, lbls in val_loader:
                    imgs, lbls = imgs.to(device), lbls.to(device)
                    outputs = model(imgs)
                    loss = criterion(outputs, lbls)
                    val_loss += loss.item() * imgs.size(0)
                    _, preds = torch.max(outputs, 1)
                    val_correct += (preds == lbls).sum().item()
                    val_total += lbls.size(0)
                    all_preds.extend(preds.cpu().numpy())
                    all_targets.extend(lbls.cpu().numpy())
                    
            val_acc = val_correct / val_total
            print(f"Epoch {epoch:02d}/{epochs:02d} | Train Acc: {train_acc*100:.2f}% | Val Acc: {val_acc*100:.2f}% | Val Loss: {val_loss/val_total:.4f}")
            
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                if val_acc > best_overall_acc:
                    best_overall_acc = val_acc
                    torch.save({
                        'model_state_dict': model.state_dict(),
                        'class_names': class_names,
                        'val_acc': val_acc,
                        'crop': crop_name,
                    }, best_model_path)
                    
        fold_accuracies.append(best_val_acc)
        print(f"Fold {fold + 1} Best Validation Accuracy: {best_val_acc*100:.2f}%")
        
    mean_acc = np.mean(fold_accuracies)
    std_acc = np.std(fold_accuracies)
    print(f"\n>> {crop_name} {n_splits}-Fold Mean Accuracy: {mean_acc*100:.2f}% (+/- {std_acc*100:.2f}%)")
    
    # Save training report & classes
    report = {
        "crop": crop_name,
        "n_splits": n_splits,
        "epochs_per_fold": epochs,
        "classes": class_names,
        "fold_accuracies": [round(float(a), 4) for a in fold_accuracies],
        "mean_accuracy": round(float(mean_acc), 4),
        "std_accuracy": round(float(std_acc), 4),
        "best_overall_accuracy": round(float(best_overall_acc), 4),
        "model_path": best_model_path
    }
    
    report_file = os.path.join(OUTPUT_DIR, f"{crop_name.lower()}_cv_report.json")
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
        
    return report

if __name__ == "__main__":
    t0 = time.time()
    rice_report = train_crop_with_kfold("Rice", n_splits=5, epochs=6, batch_size=16)
    maize_report = train_crop_with_kfold("Maize", n_splits=5, epochs=6, batch_size=16)
    
    print("\n=======================================================")
    print("           TRAINING & CROSS-VALIDATION SUMMARY         ")
    print("=======================================================")
    print(f"Rice Mean CV Accuracy : {rice_report['mean_accuracy']*100:.2f}% (+/- {rice_report['std_accuracy']*100:.2f}%)")
    print(f"Maize Mean CV Accuracy: {maize_report['mean_accuracy']*100:.2f}% (+/- {maize_report['std_accuracy']*100:.2f}%)")
    print(f"Elapsed Time: {(time.time() - t0)/60:.2f} minutes")
    print(f"Models and metrics saved to: {OUTPUT_DIR}")
