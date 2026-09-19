package com.kathiracademy.app;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "MediaDownloader")
public class MediaDownloaderPlugin extends Plugin {

    @PluginMethod
    public void saveToPublicDownloads(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Base64 data is empty or missing");
            return;
        }

        if (fileName == null || fileName.isEmpty()) {
            fileName = "Kathir_Academy_Document.pdf";
        }

        // Sanitize filename
        fileName = fileName.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            fileName += ".pdf";
        }

        Context context = getContext();
        byte[] bytes;
        try {
            bytes = Base64.decode(base64Data, Base64.DEFAULT);
        } catch (Exception e) {
            call.reject("Invalid base64 encoding: " + e.getMessage());
            return;
        }

        String savedPath = "";

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+) MediaStore API
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Kathir Academy");

                Uri uri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) {
                    call.reject("Failed to create MediaStore entry in Downloads");
                    return;
                }

                OutputStream out = context.getContentResolver().openOutputStream(uri);
                if (out == null) {
                    call.reject("Failed to open output stream for MediaStore entry");
                    return;
                }

                out.write(bytes);
                out.flush();
                out.close();

                savedPath = "Downloads/Kathir Academy/" + fileName;
            } else {
                // Legacy Android (API < 29)
                File downloadsDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "Kathir Academy");
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }

                File file = new File(downloadsDir, fileName);
                FileOutputStream out = new FileOutputStream(file);
                out.write(bytes);
                out.flush();
                out.close();

                savedPath = "Downloads/Kathir Academy/" + fileName;

                // Trigger MediaStore scan so file shows immediately in Downloads
                MediaScannerConnection.scanFile(context, new String[]{file.getAbsolutePath()}, new String[]{mimeType}, null);
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("path", savedPath);
            ret.put("fileName", fileName);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to write file to Downloads: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void openInDrive(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Base64 data is empty or missing");
            return;
        }

        if (fileName == null || fileName.isEmpty()) {
            fileName = "Kathir_Academy_Document.pdf";
        }

        // Sanitize filename
        fileName = fileName.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            fileName += ".pdf";
        }

        Context context = getContext();
        byte[] bytes;
        try {
            bytes = Base64.decode(base64Data, Base64.DEFAULT);
        } catch (Exception e) {
            call.reject("Invalid base64 encoding: " + e.getMessage());
            return;
        }

        try {
            // Write PDF to app cache directory
            File cacheDir = context.getCacheDir();
            File pdfFile = new File(cacheDir, fileName);
            FileOutputStream out = new FileOutputStream(pdfFile);
            out.write(bytes);
            out.flush();
            out.close();

            // Obtain FileProvider Content URI
            String authority = context.getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(context, authority, pdfFile);

            // Intent to view PDF in Google Drive PDF Viewer or default Android PDF reader
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, "application/pdf");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // Explicit Google Drive PDF Viewer intent chooser target
            Intent chooser = Intent.createChooser(intent, "Open PDF with Drive");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to open PDF in Drive: " + e.getMessage(), e);
        }
    }
}
