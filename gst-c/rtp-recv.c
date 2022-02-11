#include <gst/gst.h>
int main(int argc, char* argv[]) {
    GstElement* pipeline, * source, * h265dec, * rtph265depay, * sink;
    GstCaps* caps;
    GstBus* bus;
    GstMessage* msg;
    GstStateChangeReturn ret;
    gst_init(&argc, &argv);
    source = gst_element_factory_make("udpsrc", "source");
    rtph265depay = gst_element_factory_make("rtph265depay", "rtph265depay");
    h265dec = gst_element_factory_make("libde265dec", "libde265dec");
    sink = gst_element_factory_make("autovideosink", "sink");
    pipeline = gst_pipeline_new("rtp-send");
    caps = gst_caps_new_simple("application/x-rtp", "encoding-name", G_TYPE_STRING, "H265", "playload", G_TYPE_INT, 96, NULL);
    gst_bin_add_many(GST_BIN(pipeline), source, rtph265depay, h265dec, sink, NULL);
    if (!gst_element_link_many(source, rtph265depay, h265dec, sink, NULL)) {
        g_printerr("Elements could not be linked.\n");
        gst_object_unref(pipeline);
        return -1;
    }
    g_object_set(source, "port", 6000, NULL);
    g_object_set(source, "caps", caps, NULL);
    ret = gst_element_set_state(pipeline, GST_STATE_PLAYING);
    if (ret == GST_STATE_CHANGE_FAILURE) {
        g_printerr("Unable to set the pipeline to the playing state.\n");
        gst_object_unref(pipeline);
        return -1;
    }

    /* Wait until error or EOS */
    bus = gst_element_get_bus(pipeline);
    msg =
        gst_bus_timed_pop_filtered(bus, GST_CLOCK_TIME_NONE,
            GST_MESSAGE_ERROR | GST_MESSAGE_EOS);

    /* Parse message */
    if (msg != NULL) {
        GError* err;
        gchar* debug_info;

        switch (GST_MESSAGE_TYPE(msg)) {
        case GST_MESSAGE_ERROR:
            gst_message_parse_error(msg, &err, &debug_info);
            g_printerr("Error received from element %s: %s\n",
                GST_OBJECT_NAME(msg->src), err->message);
            g_printerr("Debugging information: %s\n",
                debug_info ? debug_info : "none");
            g_clear_error(&err);
            g_free(debug_info);
            break;
        case GST_MESSAGE_EOS:
            g_print("End-Of-Stream reached.\n");
            break;
        default:
            /* We should not reach here because we only asked for ERRORs and EOS */
            g_printerr("Unexpected message received.\n");
            break;
        }
        gst_message_unref(msg);
    }

    /* Free resources */
    gst_object_unref(bus);
    gst_element_set_state(pipeline, GST_STATE_NULL);
    gst_object_unref(pipeline);
    return 0;

}