package app.cleanframe.tv;

import android.app.Application;

/** Starts crash recording before any activity or service runs (see Diagnostics). */
public class ShoreApp extends Application {
    @Override public void onCreate() {
        super.onCreate();
        Diagnostics.install(this);
    }
}
