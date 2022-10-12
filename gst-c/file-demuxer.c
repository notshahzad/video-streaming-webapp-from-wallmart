#include "gst/gstelementfactory.h"
#include <gst/gst.h>

GstElement *pipeline;

void stream_decoded(GstElement *decodebin, GstPad *pad, gchar *stream_delay) {
  GstCaps *caps;
  const gchar *name;
  GstElement *sink = gst_element_factory_make("filesink", "filesink");
  g_object_set(sink, "location", "./shitworks.mp4", NULL);
  GstPad *sinkPad;
  GstElement *queue, *convert, *enc,
      *mux = gst_element_factory_make("mp4mux", "mp4mux");
  if (!gst_pad_has_current_caps(pad)) {
    g_printerr("Pad '%s' has no caps, can't do anything, ignoring\n",
               GST_PAD_NAME(pad));
    return;
  }
  caps = gst_pad_get_current_caps(pad);
  name = gst_structure_get_name(gst_caps_get_structure(caps, 0));
  g_print("decoded %s", name);

  if (g_str_has_prefix(name, "video")) {
    convert = gst_element_factory_make("videoconvert", NULL);
    enc = gst_element_factory_make("x264enc", "x264enc");

  } else if (g_str_has_prefix(name, "audio")) {
    convert = gst_element_factory_make("audioconvert", NULL);
    enc = gst_element_factory_make("avenc_aac", "audiodenc");

  }

  else {
    g_printerr("Unknown pad %s, ignoring", GST_PAD_NAME(pad));
  }
  queue = gst_element_factory_make("queue", NULL);

  sinkPad = gst_element_get_static_pad(sink, "sink");
  gst_bin_add_many(GST_BIN(pipeline), sink, convert, queue, enc, NULL);

  gst_element_link_many(queue, enc, convert, sink, NULL);
  gst_pad_link(pad, sinkPad);
  gst_element_sync_state_with_parent(queue);
  gst_element_sync_state_with_parent(convert);
  gst_element_sync_state_with_parent(sink);
}
static void cb_new_pad(GstElement *element, GstPad *pad, gpointer data) {
  gchar *name;
  GstElement *decodebin;
  GstPad *sinkpad;
  name = gst_pad_get_name(pad);
  g_print("A new pad %s was created\n", name);
  g_free(name);
  decodebin = gst_element_factory_make("decodebin", NULL);
  g_signal_connect(decodebin, "pad-added", G_CALLBACK(stream_decoded), NULL);
  gst_bin_add(GST_BIN(pipeline), decodebin);
  gst_element_sync_state_with_parent(decodebin);
  sinkpad = gst_element_get_static_pad(decodebin, "sink");
  g_assert(gst_pad_link(pad, sinkpad) == GST_PAD_LINK_OK);
}

int main(int argc, char *argv[]) {
  GstElement *source, *demux;
  GMainLoop *loop;

  gst_init(&argc, &argv);

  pipeline = gst_pipeline_new("my_pipeline");
  source = gst_element_factory_make("filesrc", "source");
  g_object_set(source, "location", argv[1], NULL);
  demux = gst_element_factory_make("qtdemux", "demuxer");

  gst_bin_add_many(GST_BIN(pipeline), source, demux, NULL);
  gst_element_link_pads(source, "src", demux, "sink");

  g_signal_connect(demux, "pad-added", G_CALLBACK(cb_new_pad), NULL);

  gst_element_set_state(GST_ELEMENT(pipeline), GST_STATE_PLAYING);
  loop = g_main_loop_new(NULL, FALSE);
  g_main_loop_run(loop);
}
