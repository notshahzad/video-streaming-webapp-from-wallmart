#include <gst/gst.h>
int main(int argc, char* argv[]) {
    GstElement* pipeline, * source, * h265enc, * rtph265pay, * sink;
    GstBus* bus;
    GstMessage* msg;
    GstStateChangeReturn ret;
    gst_init(&argc, &argv);
    source = gst_element_factory_make("videotestsrc", "source");
    h265enc = gst_element_factory_make("x265enc", "x256enc");
    rtph265pay = gst_element_factory_make("rtph265pay", "rtph265pay");
    sink = gst_element_factory_make("udpsink", "sink");
    pipeline = gst_pipeline_new("rtp-send");
    if (!pipeline || !source || !sink || !h265enc || !rtph265pay) {
        g_printerr("Not all elements could be created.\n");
        return -1;
    }
    gst_bin_add_many(GST_BIN(pipeline), source, h265enc, rtph265pay, sink, NULL);
    if (!gst_element_link_many(source, h265enc, rtph265pay, sink, NULL)) {
        g_printerr("Elements could not be linked.\n");
        gst_object_unref(pipeline);
        return -1;
    }
    g_object_set(source, "pattern", 5, NULL);
    g_object_set(sink, "host", "127.0.0.1", NULL);
    g_object_set(sink, "port", 6000, NULL);
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