var config = {};

config.onAir = {{ onair }}
config.port = 8000;
config.programText = "{{ tagline }}";
config.nextShow = "{{ next_show }}";
config.countDownTo = "{{ date }}T{{ time }}:00+0000"

module.exports = config;
