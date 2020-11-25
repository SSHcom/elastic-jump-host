##
FROM golang

ADD cmd /usr/local/cmd
RUN cd /usr/local/cmd/xconf && go build

##
##
FROM centos:7

RUN yum install -y https://info.ssh.com/hubfs/Downloads/Features/Extender/Versions%20for%20RHEL7/PrivX-Extender-16.0-75_694095ecd.x86_64.rpm

COPY --from=0 /usr/local/cmd/xconf/xconf /usr/local/bin

ADD run.sh /usr/local/bin/run.sh
CMD /usr/local/bin/run.sh
