FROM debian:bookworm-slim

ARG PUID=1000

RUN dpkg --add-architecture i386 \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        jq \
        lib32gcc-s1 \
        lib32stdc++6 \
        libicu72 \
        libsdl2-2.0-0:i386 \
        locales \
        unzip \
    && sed -i 's/^# *\(en_US.UTF-8\)/\1/' /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8

# Create steam user
RUN useradd -m -u ${PUID} -s /bin/bash steam

# Install SteamCMD
RUN mkdir -p /opt/steamcmd \
    && curl -fsSL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz \
       | tar -xz -C /opt/steamcmd \
    && printf '#!/bin/bash\nexec /opt/steamcmd/steamcmd.sh "$@"\n' > /usr/local/bin/steamcmd \
    && chmod +x /usr/local/bin/steamcmd \
    && mkdir -p /home/steam/.steam/sdk64 \
    && chown -R steam:steam /home/steam /opt/steamcmd

COPY --chown=steam:steam entrypoint.sh /home/steam/entrypoint.sh
COPY --chown=steam:steam install-plugins.sh /home/steam/install-plugins.sh
RUN chmod +x /home/steam/entrypoint.sh /home/steam/install-plugins.sh

USER steam
WORKDIR /home/steam

# Pre-run SteamCMD once to bootstrap itself
RUN steamcmd +quit

ENV CS2_DIR=/home/steam/cs2-dedicated

# Server settings
ENV SRCDS_TOKEN="" \
    CS2_SERVERNAME="CS2 Server" \
    CS2_PORT=27015 \
    CS2_MAXPLAYERS=10 \
    CS2_RCONPW="" \
    CS2_PW="" \
    CS2_LAN=0 \
    CS2_CHEATS=0 \
    CS2_GAMEALIAS="" \
    CS2_GAMETYPE=0 \
    CS2_GAMEMODE=1 \
    CS2_MAPGROUP=mg_active \
    CS2_STARTMAP=de_inferno \
    CS2_BOT_DIFFICULTY="" \
    CS2_BOT_QUOTA="" \
    CS2_BOT_QUOTA_MODE="" \
    CS2_ADDITIONAL_ARGS="" \
    TV_ENABLE=0 \
    TV_PORT=27020 \
    TV_AUTORECORD=0 \
    TV_PW="" \
    STEAMAPPVALIDATE=0 \
    FORCE_PLUGIN_REINSTALL=0 \
    GITHUB_TOKEN=""

# WeaponPaints / MySQL settings
ENV WP_DB_HOST=mysql \
    WP_DB_PORT=3306 \
    WP_DB_USER=weaponpaints \
    WP_DB_PASS=weaponpaints \
    WP_DB_NAME=weaponpaints

EXPOSE 27015/tcp 27015/udp 27020/udp

ENTRYPOINT ["/home/steam/entrypoint.sh"]
