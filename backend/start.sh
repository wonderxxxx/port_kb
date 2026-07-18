#!/bin/bash
#在项目根目录下运行这个脚本来启动后端

# 非交互式 shell 需要手动加载 conda shell hook，否则 `conda activate` 会报错
if [ -f "$HOME/miniconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/miniconda3/etc/profile.d/conda.sh"
elif [ -f "$HOME/anaconda3/etc/profile.d/conda.sh" ]; then
    source "$HOME/anaconda3/etc/profile.d/conda.sh"
else
    eval "$(conda shell.bash hook)"
fi

cd backend
conda activate port_kb
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
