package app.cleanframe.tv;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayList;
import java.util.List;

/**
 * Optional, and separate from the Home button service so that one never reads the screen: lets the paired phone
 * companion type into the text field that has focus on the TV (Keyboard tab). The owner turns it on under Android's
 * Accessibility settings as "Shore phone keyboard". It does nothing on its own; when text arrives from the phone it
 * finds the focused field and replaces that field's text.
 */
public class PhoneKeyboardService extends AccessibilityService {
    private static volatile PhoneKeyboardService instance;

    static boolean on() { return instance != null; }

    @Override protected void onServiceConnected() { instance = this; }

    @Override public boolean onUnbind(Intent intent) { instance = null; return super.onUnbind(intent); }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) { }

    @Override public void onInterrupt() { }

    /** Sets the focused field's text (null keeps it), then presses Enter if asked. Returns "" when done, else off or field. */
    static String type(String text, boolean enter) {
        PhoneKeyboardService s = instance;
        if (s == null) return "off";
        AccessibilityNodeInfo root = s.getRootInActiveWindow();
        if (root == null) return "field";
        AccessibilityNodeInfo field = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (field == null || !field.isEditable()) {
            // No keyboard focus yet (many TV apps show a search box before it is selected): use the only text field on screen.
            List<AccessibilityNodeInfo> found = new ArrayList<>();
            editable(root, found, 0);
            field = found.size() == 1 ? found.get(0) : null;
        }
        if (field == null) return "field";
        if (text != null) {
            Bundle args = new Bundle();
            args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
            if (!field.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) return "field";
        }
        if (enter && Build.VERSION.SDK_INT >= 30) field.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_IME_ENTER.getId());
        return "";
    }

    private static void editable(AccessibilityNodeInfo node, List<AccessibilityNodeInfo> out, int depth) {
        if (node == null || depth > 40 || out.size() > 1) return;
        if (node.isEditable() && node.isVisibleToUser()) { out.add(node); return; }
        for (int i = 0; i < node.getChildCount(); i++) editable(node.getChild(i), out, depth + 1);
    }
}
